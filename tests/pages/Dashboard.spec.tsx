import React from 'react';
import AxiosMock from 'axios-mock-adapter';
import { mocked } from 'ts-jest/utils';
import { render, fireEvent, act, wait } from '@testing-library/react-native';
import { Alert } from 'react-native';

import api from '../../src/services/api';
import Dashboard from '../../src/pages/Dashboard';
import { useCart } from '../../src/hooks/cart';
import factory from '../utils/factory';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
}

jest.mock('@react-navigation/native', () => {
  // Require the original module to not be mocked...
  const originalModule = jest.requireActual('@react-navigation/native');

  return {
    __esModule: true, // Use it when dealing with esModules
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

const apiMock = new AxiosMock(api);

describe('Dashboard', () => {
  it('should be able to list products', async () => {
    const products = await factory.attrsMany<Product>('Product', 2);
    const [product] = products;
    apiMock.onGet('products').reply(200, products);

    const { getByText, getByTestId } = render(<Dashboard />);

    await wait(() => expect(getByText(product.title)).toBeTruthy(), {
      timeout: 200,
    });

    products.forEach(({ title, id }) => {
      expect(getByText(title)).toBeTruthy();
      expect(getByTestId(`add-to-cart-${id}`)).toBeTruthy();
    });
  });

  it('should not be able to list products', async () => {
    apiMock.onGet('products').reply(404);

    const alert = jest.spyOn(Alert, 'alert');
    render(<Dashboard />);

    await wait(() => expect(alert).toHaveBeenCalled());

    expect(alert).toHaveBeenCalledWith(
      'Ops! Não foi possivel carregar os produtos agora, tente novamente mais tarde!',
    );
  });

  it('should be able to add item to cart', async () => {
    const useCartMocked = mocked(useCart);
    const addToCart = jest.fn();

    useCartMocked.mockReturnValue({
      addToCart,
      products: [],
      increment: jest.fn(),
      decrement: jest.fn(),
    });

    const product = await factory.attrs<Product>('Product');

    apiMock.onGet('products').reply(200, [product]);

    const { getByText, getByTestId } = render(<Dashboard />);

    await wait(() => expect(getByText(product.title)).toBeTruthy(), {
      timeout: 200,
    });

    act(() => {
      fireEvent.press(getByTestId(`add-to-cart-${product.id}`));
    });

    expect(addToCart).toHaveBeenCalledWith(product);
  });
});
