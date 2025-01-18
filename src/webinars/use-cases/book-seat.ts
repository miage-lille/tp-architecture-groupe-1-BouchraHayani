import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';
import { IParticipationRepository } from 'src/webinars/ports/participation-repository.interface';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';
import { Participation } from 'src/webinars/entities/participation.entity';
import { Webinar } from 'src/webinars/entities/webinar.entity';

type Request = {
  webinarId: string;
  user: User;
};
type Response = void;

export class BookSeat implements Executable<Request, Response> {
  constructor(
    private readonly participationRepository: IParticipationRepository,
    private readonly userRepository: IUserRepository,
    private readonly webinarRepository: IWebinarRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute({ webinarId, user }: Request): Promise<Response> {
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    const existingParticipation =
      await this.participationRepository.findByWebinarIdAndUserId(
        webinarId,
        user.id,
      );
    if (existingParticipation) {
      throw new Error('User already participates in this webinar');
    }

    const participations =
      await this.participationRepository.findByWebinarId(webinarId);
    if (participations.length >= webinar.props.seats) {
      throw new Error('No seats available');
    }

    const participation = new Participation({
      userId: user.id,
      webinarId: webinarId,
    });

    await this.participationRepository.save(participation);

    const organizer = await this.userRepository.findById(
      webinar.props.organizerId,
    );
    if (organizer) {
      await this.mailer.send({
        to: organizer.email,
        subject: 'New Participant',
        body: `A new participant has booked a seat for your webinar "${webinar.props.title}".`,
      });
    }
  }
}
