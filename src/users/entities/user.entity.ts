import { Entity } from 'src/shared/entity';

type UserProps = {
  id: string;
  email: string;
  password: string;
};
export class User extends Entity<UserProps> {
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }
}
