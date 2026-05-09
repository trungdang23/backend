import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

import {
  ApiErrorEnvelopeResponseDto,
  PaginatedCollectionMetaDto,
} from './swagger-response.dto';

type EnvelopeModel = Type<unknown>;

interface ApiEnvelopeResponseOptions {
  description: string;
  isArray?: boolean;
  metaModel?: EnvelopeModel;
  status?: 200 | 201;
}

interface ApiErrorEnvelopeResponseOptions {
  description: string;
  status: number;
}

function buildSuccessEnvelopeSchema(
  model: EnvelopeModel,
  options: Omit<ApiEnvelopeResponseOptions, 'description' | 'status'>,
): SchemaObject {
  const properties: Record<string, SchemaObject | ReferenceObject> = {
    success: {
      type: 'boolean',
      example: true,
    },
    data: options.isArray
      ? {
          type: 'array',
          items: {
            $ref: getSchemaPath(model),
          },
        }
      : {
          $ref: getSchemaPath(model),
        },
  };

  const required = ['success', 'data'];

  if (options.metaModel !== undefined) {
    properties.meta = {
      $ref: getSchemaPath(options.metaModel),
    };
    required.push('meta');
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

export function ApiSuccessEnvelopeResponse(
  model: EnvelopeModel,
  options: ApiEnvelopeResponseOptions,
) {
  const responseDecorator =
    options.status === 201 ? ApiCreatedResponse : ApiOkResponse;

  return applyDecorators(
    ApiExtraModels(
      model,
      ...(options.metaModel === undefined ? [] : [options.metaModel]),
    ),
    responseDecorator({
      description: options.description,
      schema: buildSuccessEnvelopeSchema(model, {
        isArray: options.isArray,
        metaModel: options.metaModel,
      }),
    }),
  );
}

export function ApiPaginatedSuccessEnvelopeResponse(
  model: EnvelopeModel,
  description: string,
) {
  return ApiSuccessEnvelopeResponse(model, {
    description,
    isArray: true,
    metaModel: PaginatedCollectionMetaDto,
    status: 200,
  });
}

export function ApiErrorEnvelopeResponse(
  options: ApiErrorEnvelopeResponseOptions,
) {
  return applyDecorators(
    ApiExtraModels(ApiErrorEnvelopeResponseDto),
    ApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        $ref: getSchemaPath(ApiErrorEnvelopeResponseDto),
      },
    }),
  );
}
