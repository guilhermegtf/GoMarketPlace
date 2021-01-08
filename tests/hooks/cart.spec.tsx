import React from 'react';
import { mocked } from 'ts-jest/utils';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  render,
  fireEvent,
  act,
  wait,
  cleanup,
} from '@testing-library/react-native';
import AsyncStorage from '@react-native-community/async-storage';

import { CartProvider, useCart } from '../../src/hooks/cart';
import factory from '../utils/factory';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
}

jest.useFakeTimers();
jest.mock('@react-native-community/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    removeItem: jest.fn(),
    getItem: jest.fn().mockReturnValue(null),
    clear: jest.fn(),
  },
}));

const mockedAsyncStorage = mocked(AsyncStorage);

describe('Cart Context', () => {
  let TestComponent: React.FC;
  let product;

  beforeAll(async () => {
    product = await factory.attrs<Product>('Product');
    TestComponent = () => {
      const { products, addToCart, increment, decrement } = useCart();

      function handleAddToCart(): void {
        addToCart(product);
      }

      function handleIncrement(): void {
        increment(product.id);
      }

      function handleDecrement(): void {
        decrement(product.id);
      }

      return (
        <>
          <TouchableOpacity testID="add-to-cart" onPress={handleAddToCart}>
            Add to cart
          </TouchableOpacity>

          <TouchableOpacity testID="increment" onPress={handleIncrement}>
            Increment
          </TouchableOpacity>

          <TouchableOpacity testID="decrement" onPress={handleDecrement}>
            Decrement
          </TouchableOpacity>

          {products.map(({ id, title, quantity }) => (
            <View key={id}>
              <Text>{title}</Text>
              <Text>{quantity}</Text>
            </View>
          ))}
        </>
      );
    };
  });

  afterEach(() => {
    mockedAsyncStorage.setItem.mockClear();
    mockedAsyncStorage.getItem.mockClear();

    cleanup();
  });

  it('should be able to add products to the cart', async () => {
    const { getByText, getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    act(() => {
      fireEvent.press(getByTestId('add-to-cart'));
    });

    expect(getByText(product.title)).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });

  it('should be able to increment a product already added to cart', async () => {
    const { getByText, getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    act(() => {
      fireEvent.press(getByTestId('add-to-cart'));
    });

    act(() => {
      fireEvent.press(getByTestId('add-to-cart'));
    });

    expect(getByText(product.title)).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('should be able to increment quantity', async () => {
    const { getByText, getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    act(() => {
      fireEvent.press(getByTestId('add-to-cart'));
    });

    act(() => {
      fireEvent.press(getByTestId('increment'));
    });

    expect(getByText('2')).toBeTruthy();
  });

  it('should be able to decrement quantity', async () => {
    const { getByText, getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    act(() => {
      fireEvent.press(getByTestId('add-to-cart'));
    });

    act(() => {
      fireEvent.press(getByTestId('increment'));
    });

    act(() => {
      fireEvent.press(getByTestId('decrement'));
    });

    expect(getByText('1')).toBeTruthy();
  });

  it('should store products in AsyncStorage while adding, incrementing and decrementing', async () => {
    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    await act(async () => {
      fireEvent.press(getByTestId('add-to-cart'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('increment'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('decrement'));
    });

    expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(3);
  });

  it('should load products from AsyncStorage', async () => {
    const { title, id, image_url, price } = await factory.attrs<Product>(
      'Product',
    );
    mockedAsyncStorage.getItem.mockReturnValue(
      new Promise(resolve =>
        resolve(
          JSON.stringify([
            {
              title,
              id,
              image_url,
              price,
              quantity: 0,
            },
          ]),
        ),
      ),
    );

    const { getByText } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    await wait(() => expect(getByText(title)).toBeTruthy());

    expect(getByText(title)).toBeTruthy();
  });

  it('should not be able to render component without provider', async () => {
    // eslint-disable-next-line no-console
    console.error = jest.fn();

    try {
      render(<TestComponent />);
    } catch (err) {
      expect(err).toStrictEqual(
        new Error('useCart must be used within a CartProvider'),
      );
    }
  });
});
