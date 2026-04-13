export abstract class ValueObject<TValue> {
  protected constructor(protected readonly value: TValue) {}

  equals(other?: ValueObject<TValue>): boolean {
    if (other === undefined) {
      return false;
    }

    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }
}
