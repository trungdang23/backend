import { NestFactory } from '@nestjs/core';

import type { ItineraryRepositoryPort } from '../src/modules/itineraries/application/ports/itinerary-repository.port';
import { ITINERARY_REPOSITORY } from '../src/modules/itineraries/application/ports/itinerary-repository.port';
import {
  buildPlanNodesFromLegacyItinerary,
  type BuildPlanNodesFromLegacyItineraryResult,
} from '../src/modules/planning/application/migrations/build-plan-nodes-from-legacy-itinerary';
import type { PlanNode } from '../src/modules/planning/domain/plan-node';
import { PrismaService } from '../src/shared/infrastructure/prisma/prisma.service';

process.env.NODE_ENV ??= 'development';

type MigrationStatus =
  | 'ready'
  | 'applied'
  | 'skipped-existing-plan-nodes'
  | 'no-itinerary-data';

interface CliOptions {
  all: boolean;
  apply: boolean;
  help: boolean;
  json: boolean;
  tripIds: string[];
}

interface TripMigrationReport {
  tripId: string;
  status: MigrationStatus;
  existingPlanNodeCount: number;
  legacyDayCount: number;
  legacyActivityCount: number;
  generatedNodeCount: number;
  warningCount: number;
  summary: BuildPlanNodesFromLegacyItineraryResult['summary'];
  warnings: BuildPlanNodesFromLegacyItineraryResult['warnings'];
  nodes: PlanNode[];
}

void main();

async function main(): Promise<void> {
  let options: CliOptions;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    exitWithError(error);
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  const { AppModule } = await import('../src/app/app.module');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const prisma = app.get(PrismaService);
    const itineraryRepository =
      app.get<ItineraryRepositoryPort>(ITINERARY_REPOSITORY);
    const targetTripIds = await resolveTargetTripIds(options, prisma);
    const reports: TripMigrationReport[] = [];

    for (const tripId of targetTripIds) {
      const report = await inspectTrip({
        tripId,
        itineraryRepository,
        prisma,
      });
      reports.push(
        report.status === 'ready' && options.apply
          ? await applyTripMigration(prisma, report)
          : report,
      );
    }

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            mode: options.apply ? 'apply' : 'dry-run',
            nodeEnv: process.env.NODE_ENV,
            reports: reports.map(toSerializableReport),
            totals: buildTotals(reports),
          },
          null,
          2,
        ),
      );
      return;
    }

    printHumanReport(reports, options);
  } finally {
    await app.close();
  }
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    all: false,
    apply: false,
    help: false,
    json: false,
    tripIds: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--all') {
      options.all = true;
      continue;
    }

    if (argument === '--') {
      continue;
    }

    if (argument === '--apply') {
      options.apply = true;
      continue;
    }

    if (argument === '--json') {
      options.json = true;
      continue;
    }

    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    if (argument === '--trip-id') {
      const tripId = args[index + 1];

      if (tripId === undefined) {
        throw new Error('Missing value after --trip-id.');
      }

      options.tripIds.push(normalizeTripId(tripId));
      index += 1;
      continue;
    }

    if (argument.startsWith('--trip-id=')) {
      options.tripIds.push(
        normalizeTripId(argument.slice('--trip-id='.length)),
      );
      continue;
    }

    throw new Error(`Unsupported argument: ${argument}`);
  }

  if (!options.help && !options.all && options.tripIds.length === 0) {
    throw new Error(
      'Pass --all or at least one --trip-id to define migration scope.',
    );
  }

  return options;
}

async function resolveTargetTripIds(
  options: CliOptions,
  prisma: PrismaService,
): Promise<string[]> {
  if (!options.all) {
    return uniqueTripIds(options.tripIds);
  }

  const records = await prisma.tripItineraryDay.findMany({
    select: {
      tripId: true,
    },
    distinct: ['tripId'],
  });

  return uniqueTripIds(records.map((record) => record.tripId));
}

async function inspectTrip(input: {
  tripId: string;
  itineraryRepository: ItineraryRepositoryPort;
  prisma: PrismaService;
}): Promise<TripMigrationReport> {
  const dayAggregates = await input.itineraryRepository.listDayAggregatesByTrip(
    {
      tripId: input.tripId,
    },
  );
  const existingPlanNodeCount = await input.prisma.planNode.count({
    where: {
      tripId: input.tripId,
    },
  });
  const legacyDayCount = dayAggregates.length;
  const legacyActivityCount = dayAggregates.reduce(
    (total, aggregate) => total + aggregate.activities.length,
    0,
  );

  if (legacyDayCount === 0) {
    return {
      tripId: input.tripId,
      status: 'no-itinerary-data',
      existingPlanNodeCount,
      legacyDayCount,
      legacyActivityCount,
      generatedNodeCount: 0,
      warningCount: 0,
      summary: emptySummary(),
      warnings: [],
      nodes: [],
    };
  }

  const migration = buildPlanNodesFromLegacyItinerary({
    tripId: input.tripId,
    dayAggregates,
  });

  return {
    tripId: input.tripId,
    status: existingPlanNodeCount > 0 ? 'skipped-existing-plan-nodes' : 'ready',
    existingPlanNodeCount,
    legacyDayCount,
    legacyActivityCount,
    generatedNodeCount: migration.nodes.length,
    warningCount: migration.warnings.length,
    summary: migration.summary,
    warnings: migration.warnings,
    nodes: migration.nodes,
  };
}

async function applyTripMigration(
  prisma: PrismaService,
  report: TripMigrationReport,
): Promise<TripMigrationReport> {
  await prisma.$transaction(async (transaction) => {
    const existingPlanNodeCount = await transaction.planNode.count({
      where: {
        tripId: report.tripId,
      },
    });

    if (existingPlanNodeCount > 0) {
      throw new Error(
        `Trip ${report.tripId} gained ${existingPlanNodeCount} plan node(s) before apply; aborting migration for that trip.`,
      );
    }

    for (const node of report.nodes) {
      await transaction.planNode.create({
        data: toPlanNodeCreateInput(node),
      });
    }
  });

  return {
    ...report,
    status: 'applied',
  };
}

function toPlanNodeCreateInput(node: PlanNode) {
  return {
    id: node.id,
    tripId: node.tripId,
    parentId: node.parentId,
    type: node.type,
    title: node.title,
    notes: node.notes,
    startAt: node.startAt,
    endAt: node.endAt,
    costAmount: node.costAmount,
    costCurrency: node.costCurrency,
    imageUrl: node.imageUrl,
    sortOrder: node.sortOrder,
    depth: node.depth,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

function toSerializableReport(report: TripMigrationReport) {
  return {
    tripId: report.tripId,
    status: report.status,
    existingPlanNodeCount: report.existingPlanNodeCount,
    legacyDayCount: report.legacyDayCount,
    legacyActivityCount: report.legacyActivityCount,
    generatedNodeCount: report.generatedNodeCount,
    warningCount: report.warningCount,
    summary: report.summary,
    warnings: report.warnings,
  };
}

function buildTotals(reports: TripMigrationReport[]) {
  return {
    tripCount: reports.length,
    readyCount: reports.filter((report) => report.status === 'ready').length,
    appliedCount: reports.filter((report) => report.status === 'applied')
      .length,
    skippedExistingPlanNodesCount: reports.filter(
      (report) => report.status === 'skipped-existing-plan-nodes',
    ).length,
    noItineraryDataCount: reports.filter(
      (report) => report.status === 'no-itinerary-data',
    ).length,
    warningCount: reports.reduce(
      (total, report) => total + report.warningCount,
      0,
    ),
    generatedNodeCount: reports.reduce(
      (total, report) => total + report.generatedNodeCount,
      0,
    ),
  };
}

function printHumanReport(
  reports: TripMigrationReport[],
  options: CliOptions,
): void {
  const totals = buildTotals(reports);

  console.log('Legacy itinerary -> PlanNode migration');
  console.log(`Mode: ${options.apply ? 'apply' : 'dry-run'}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`Trips in scope: ${totals.tripCount}`);
  console.log(`Ready: ${totals.readyCount}`);
  console.log(`Applied: ${totals.appliedCount}`);
  console.log(
    `Skipped existing plan nodes: ${totals.skippedExistingPlanNodesCount}`,
  );
  console.log(`No itinerary data: ${totals.noItineraryDataCount}`);
  console.log(`Generated nodes: ${totals.generatedNodeCount}`);
  console.log(`Warnings: ${totals.warningCount}`);

  if (reports.length === 0) {
    console.log('No trips matched the selected scope.');
    return;
  }

  console.log('');

  for (const report of reports) {
    console.log(
      `- ${report.tripId}: ${report.status} | legacy days=${report.legacyDayCount} | legacy activities=${report.legacyActivityCount} | generated nodes=${report.generatedNodeCount} | warnings=${report.warningCount} | existing plan nodes=${report.existingPlanNodeCount}`,
    );

    for (const warning of report.warnings) {
      console.log(`  warning: ${warning.code} (${warning.message})`);
    }
  }
}

function printHelp(): void {
  console.log(`Usage:
  pnpm migrate:itinerary-to-plan-nodes -- --trip-id=<trip-id>
  pnpm migrate:itinerary-to-plan-nodes -- --trip-id=<trip-id> --apply
  pnpm migrate:itinerary-to-plan-nodes -- --all

Options:
  --trip-id <id>   Target a specific trip. Repeatable.
  --all            Target every trip that still has itinerary day records.
  --apply          Write plan nodes. Without this flag the script is dry-run only.
  --json           Emit machine-readable JSON instead of human-readable logs.
  --help, -h       Show this help text.`);
}

function uniqueTripIds(tripIds: string[]): string[] {
  return [...new Set(tripIds)].sort((left, right) => left.localeCompare(right));
}

function normalizeTripId(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new Error('Trip id must not be empty.');
  }

  return normalizedValue;
}

function emptySummary(): BuildPlanNodesFromLegacyItineraryResult['summary'] {
  return {
    dayNodeCount: 0,
    locationNodeCount: 0,
    activityNodeCount: 0,
    costNoteNodeCount: 0,
    costBearingNodeCount: 0,
  };
}

function exitWithError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
