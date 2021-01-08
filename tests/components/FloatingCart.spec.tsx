import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { mocked } from 'ts-jest/utils';
import { render, fireEvent, act } from '@testing-library/react-native';

import FloatingCart from '../../src/components/FloatingCart';
import { useCart } from '../../src/hooks/cart';
import factory from '../utils/factory';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

jest.mock('@react-navigation/native', () => {
  const originalModule = jest.requireActual('@react-navigation/native');

  return {
    __esModule: true,
    ...originalModule,
    useNavigation: jest.fn(),
  };
});

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
const useNavigationMocked = mocked(useNavigation);
const navigate = jest.fn();

useNavigationMocked.mockReturnValue({
  navigate,
} as any);

describe('Dashboard', () => {
  beforeAll(async () => {
    const products = await factory.attrsMany<Product>('Product', 2, [
      { quantity: 10, price: 600 },
      { quantity: 5, price: 400 },
    ]);
    useCartMocked.mockReturnValue({
      addToCart: jest.fn(),
      products,
      increment: jest.fn(),
      decrement: jest.fn(),
    });
  });

  it('should be able to calculate the cart total', async () => {
    const { getByText } = render(<FloatingCart />);

    expect(getByText('8000')).toBeTruthy();
  });

  it('should be able to show the total quantity of itens in the cart', async () => {
    const { getByText } = render(<FloatingCart />);

    expect(getByText('15 itens')).toBeTruthy();
  });

  it('should be able to navigate to the cart', async () => {
    const { getByTestId } = render(<FloatingCart />);

    act(() => {
      fireEvent.press(getByTestId('navigate-to-cart-button'));
    });

    expect(navigate).toHaveBeenCalledWith('Cart');
  });
});
