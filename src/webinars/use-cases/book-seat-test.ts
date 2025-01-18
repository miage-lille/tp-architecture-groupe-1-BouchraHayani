import { BookSeat } from 'src/webinars/use-cases/book-seat';
import { InMemoryParticipationRepository } from 'src/webinars/adapters/participation-repository.in-memory';
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { InMemoryUserRepository } from 'src/users/adapters/user-repository.in-memory';
import { InMemoryMailer } from 'src/core/adapters/in-memory-mailer';
import { User } from 'src/users/entities/user.entity';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { Participation } from 'src/webinars/entities/participation.entity';

describe('Feature: Book a seat', () => {
  let participationRepository: InMemoryParticipationRepository;
  let webinarRepository: InMemoryWebinarRepository;
  let userRepository: InMemoryUserRepository;
  let mailer: InMemoryMailer;
  let useCase: BookSeat;

  const organizer = new User({
    id: 'organizer-id',
    email: 'organizer@example.com',
    password: 'password',
  });

  const participant = new User({
    id: 'participant-id',
    email: 'participant@example.com',
    password: 'password',
  });

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: organizer.id,
    title: 'Webinar Title',
    startDate: new Date('2024-01-10T10:00:00.000Z'),
    endDate: new Date('2024-01-10T11:00:00.000Z'),
    seats: 100,
  });

  beforeEach(() => {
    participationRepository = new InMemoryParticipationRepository();
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    userRepository = new InMemoryUserRepository([organizer, participant]);
    mailer = new InMemoryMailer();
    useCase = new BookSeat(
      participationRepository,
      userRepository,
      webinarRepository,
      mailer,
    );
  });

  describe('Scenario: Happy path', () => {
    it('should book a seat and send an email to the organizer', async () => {
      await useCase.execute({
        webinarId: webinar.props.id,
        user: participant,
      });

      const participation = participationRepository.database[0];
      expect(participation.props).toEqual({
        userId: participant.id,
        webinarId: webinar.props.id,
      });

      expect(mailer.sentEmails.length).toBe(1);
      expect(mailer.sentEmails[0]).toEqual({
        to: organizer.email,
        subject: 'New Participant',
        body: `A new participant has booked a seat for your webinar "${webinar.props.title}".`,
      });
    });
  });

  describe('Scenario: Webinar not found', () => {
    it('should throw an error', async () => {
      await expect(
        useCase.execute({
          webinarId: 'unknown-webinar-id',
          user: participant,
        }),
      ).rejects.toThrow('Webinar not found');
    });
  });

  describe('Scenario: No seats available', () => {
    it('should throw an error', async () => {
      for (let i = 0; i < webinar.props.seats; i++) {
        await participationRepository.save(
          new Participation({
            userId: `user-${i}`,
            webinarId: webinar.props.id,
          }),
        );
      }

      await expect(
        useCase.execute({
          webinarId: webinar.props.id,
          user: participant,
        }),
      ).rejects.toThrow('No seats available');
    });
  });

  describe('Scenario: User already participates', () => {
    it('should throw an error', async () => {
      await participationRepository.save(
        new Participation({
          userId: participant.id,
          webinarId: webinar.props.id,
        }),
      );

      await expect(
        useCase.execute({
          webinarId: webinar.props.id,
          user: participant,
        }),
      ).rejects.toThrow('User already participates in this webinar');
    });
  });
});
