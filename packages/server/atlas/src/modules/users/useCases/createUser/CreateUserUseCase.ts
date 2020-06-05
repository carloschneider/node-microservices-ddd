import { IUseCase } from '@core/domain/UseCase';
import User from '@modules/users/domain/User';
import IUserRepo from '@modules/users/repositories/IUserRepo';
import Result, { failure, Either, success } from '@core/logic/Result';
import * as GenericAppError from '@core/logic/AppError';
import ICreateUserDTO from './ICreateUserDTO';
import * as CreateUserErrors from './CreateUserErrors';

type Response = Either<
  | GenericAppError.UnexpectedError
  | CreateUserErrors.AccountAlreadyExists
  | Result<any>,
  Result<void>
>;

export default class CreateUserUseCase
  implements IUseCase<ICreateUserDTO, Promise<Response>> {
  private userRepo: IUserRepo;

  constructor(userRepo: IUserRepo) {
    this.userRepo = userRepo;
  }

  async execute(req: ICreateUserDTO): Promise<Response> {
    const { name, email, password } = req;

    const userOrError = User.create({
      name,
      email,
      password,
    });

    if (userOrError.isFailure) {
      return failure(Result.fail(userOrError.error));
    }

    const user = userOrError.getValue();

    const userAlreadyExists = await this.userRepo.exists(user.email);

    if (userAlreadyExists) {
      return failure(new CreateUserErrors.AccountAlreadyExists(user.email));
    }

    try {
      await this.userRepo.save(user);
    } catch (err) {
      return failure(new GenericAppError.UnexpectedError(err));
    }

    return success(Result.ok());
  }
}
