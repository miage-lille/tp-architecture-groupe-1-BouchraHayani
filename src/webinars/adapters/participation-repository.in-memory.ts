import { Participation } from 'src/webinars/entities/participation.entity';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';

export class InMemoryParticipationRepository
  implements IParticipationRepository
{
  constructor(public database: Participation[] = []) {}

  async findByWebinarId(webinarId: string): Promise<Participation[]> {
    return this.database.filter((p) => p.props.webinarId === webinarId);
  }

  async findByWebinarIdAndUserId(
    webinarId: string,
    userId: string,
  ): Promise<Participation | null> {
    return (
      this.database.find(
        (p) => p.props.webinarId === webinarId && p.props.userId === userId,
      ) || null
    );
  }

  async save(participation: Participation): Promise<void> {
    this.database.push(participation);
  }
}
