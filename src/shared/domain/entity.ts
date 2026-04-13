export abstract class Entity<TProps extends Record<string, unknown>> {
  protected constructor(protected readonly props: TProps) {}

  equals(entity?: Entity<TProps>): boolean {
    if (entity === undefined) {
      return false;
    }

    return (
      this.constructor === entity.constructor &&
      JSON.stringify(this.props) === JSON.stringify(entity.props)
    );
  }
}
