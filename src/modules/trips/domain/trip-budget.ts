import { DomainError } from '../../../shared/domain/domain-error';
import { ValueObject } from '../../../shared/domain/value-object';

export const MAX_TRIP_BUDGET_AMOUNT = 2_147_483_647;

const ISO_CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

interface TripBudgetProps {
  amount: number;
  currency: string;
}

export class TripBudget extends ValueObject<TripBudgetProps> {
  private constructor(value: TripBudgetProps) {
    super(value);
  }

  static create(input: { amount: number; currency: string }): TripBudget {
    if (
      !Number.isInteger(input.amount) ||
      input.amount < 0 ||
      input.amount > MAX_TRIP_BUDGET_AMOUNT
    ) {
      throw new DomainError(
        `Budget amount must be a whole number between 0 and ${MAX_TRIP_BUDGET_AMOUNT}.`,
      );
    }

    const currency = input.currency.trim().toUpperCase();

    if (!ISO_CURRENCY_CODE_REGEX.test(currency)) {
      throw new DomainError(
        'Budget currency must be a valid ISO 4217 currency code.',
      );
    }

    return new TripBudget({
      amount: input.amount,
      currency,
    });
  }

  get amount(): number {
    return this.value.amount;
  }

  get currency(): string {
    return this.value.currency;
  }
}
