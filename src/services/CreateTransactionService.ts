import { getRepository, getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction Type is invalid.');
    }

    let findCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!findCategory) {
      findCategory = await categoriesRepository.save({
        title: category,
      });
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError('You dont have enough balance.', 400);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: findCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
