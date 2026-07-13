// Screenplay core (MF-12): a deliberately small, hand-rolled implementation in
// the portfolio's house style (cf. hand-baked-screenplay-pattern) — actors who,
// using abilities, attempt tasks and ask questions. No framework dependency;
// just enough structure for the mobile journeys to read as user stories.

export interface Ability {}

/**
 * The ability lookup key: the class itself. Typed structurally (prototype +
 * name) rather than as a `new (...)` signature so classes with PRIVATE
 * constructors — the house style for static factories — are accepted.
 */
interface AbilityType<A extends Ability> {
  readonly prototype: A;
  readonly name: string;
}

export interface Task {
  performAs(actor: Actor): Promise<void>;
  toString(): string;
}

export interface Question<T> {
  answeredBy(actor: Actor): Promise<T>;
  toString(): string;
}

export class Actor {
  private readonly abilities = new Map<unknown, Ability>();

  private constructor(readonly name: string) {}

  static named(name: string): Actor {
    return new Actor(name);
  }

  whoCan(...abilities: Ability[]): this {
    for (const ability of abilities) {
      this.abilities.set(ability.constructor, ability);
    }
    return this;
  }

  abilityTo<A extends Ability>(type: AbilityType<A>): A {
    const ability = this.abilities.get(type);
    if (!ability) throw new Error(`${this.name} does not have the ability ${type.name}`);
    return ability as A;
  }

  async attemptsTo(...tasks: Task[]): Promise<void> {
    for (const task of tasks) {
      await task.performAs(this);
    }
  }

  async asks<T>(question: Question<T>): Promise<T> {
    return question.answeredBy(this);
  }
}
