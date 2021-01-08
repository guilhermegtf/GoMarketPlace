import faker from 'faker';
import factory from 'factory-girl';

factory.define(
  'Product',
  {},
  {
    id: () => String(faker.random.number()),
    title: faker.name.title,
    image_url: faker.image.imageUrl,
    price: faker.finance.amount,
    quantity: () => faker.random.number({ min: 1, max: 3 }),
  },
);

export default factory;
