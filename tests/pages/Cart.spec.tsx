import React from 'react';
import { mocked } from 'ts-jest/utils';
import { render, fireEvent, act } from '@testing-library/react-native';

import Cart from '../../src/pages/Cart';
import { useCart } from '../../src/hooks/cart';
import factory from '../utils/factory';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

jest.mock('../../src/hooks/cart.tsx', () => ({
  __esModule: true,
  useCart: jest.fn().mockReturnValue({
    addToCart: jest.fn(),
    products: [],
  }),
}));

jest.mock('../../src/utils/formatValue.ts', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(value => value),
}));

const useCartMocked = mocked(useCart);

describe('Cart', () => {
  let products: Product[];

  beforeAll(async () => {
    products = await factory.attrsMany<Product>('Product', 2, [
      {
        price: 400,
        quantity: 5,
      },
      {
        price: 600,
        quantity: 10,
      },
    ]);
    useCartMocked.mockReturnValue({
      addToCart: jest.fn(),
      products,
      increment: jest.fn(),
      decrement: jest.fn(),
    });
  });

  it('should be able to list products on the cart', async () => {
    const { getByText } = render(<Cart />);

    products.forEach(product => {
      expect(getByText(product.title)).toBeTruthy();
      expect(getByText(`${product.price}`)).toBeTruthy();
      expect(getByText(`${product.price * product.quantity}`)).toBeTruthy();
      expect(getByText(`${product.quantity}x`)).toBeTruthy();
    });
  });

  it('should be able to calculate the cart total', async () => {
    const { getByText } = render(<Cart />);

    expect(getByText('8000')).toBeTruthy();
  });

  it('should be able to calculate the cart total', async () => {
    const { getByText } = render(<Cart />);

    expect(getByText('15 itens')).toBeTruthy();
  });

  it('should be able to increment product quantity on the cart', async () => {
    const increment = jest.fn();

    const product = await factory.attrs<Product>('Product');
    useCartMocked.mockReturnValue({
      addToCart: jest.fn(),
      products: [
        {
          ...product,
          quantity: 5,
        },
      ],
      increment,
      decrement: jest.fn(),
    });

    const { getByTestId } = render(<Cart />);

    act(() => {
      fireEvent.press(getByTestId(`increment-${product.id}`));
    });

    expect(increment).toHaveBeenCalledWith(`${product.id}`);
  });

  it('should be able to decrement product quantity on the cart', async () => {
    const decrement = jest.fn();

    const product = await factory.attrs<Product>('Product');
    useCartMocked.mockReturnValue({
      addToCart: jest.fn(),
      products: [product],
      increment: jest.fn(),
      decrement,
    });

    const { getByTestId } = render(<Cart />);

    act(() => {
      fireEvent.press(getByTestId(`decrement-${product.id}`));
    });

    expect(decrement).toHaveBeenCalledWith(`${product.id}`);
  });
});
