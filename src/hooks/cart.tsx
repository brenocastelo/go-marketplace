import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const products = await AsyncStorage.getItem('GoMarketplace:products');

      if (products) {
        setProducts(JSON.parse(products));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(
        cartProduct => cartProduct.id === product.id,
      );

      if (productExists) {
        increment(product.id);

        return;
      }

      const updatedProduct = {
        ...product,
        quantity: 1,
      };

      const updatedCartProducts = [...products, updatedProduct];

      saveProductsOnStorage(updatedCartProducts)

      setProducts(updatedCartProducts);
    },

    /**
     * ideia: se o products não estiver no array de dependencia,
     * essa função só vai ser criada uma vez, então sempre vai estar ]
     * com o estado de products vazio (que é o estado inicial), logo
     * quando adicionamos um produto ele ficara com um produto só, e o estado é atualizado,
     * mas como o products não ESTAVA no array de dependencias a função não é recriada,
     * permanecendo com o array de products vazio
     *
     *  */

    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedCartProducts = products.map(product => {
        return product.id === id ? {
          ...product,
          quantity: product.quantity + 1
        } : product;
      });

      saveProductsOnStorage(updatedCartProducts)

      setProducts(updatedCartProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedCartProducts = products.map(product => {
        return product.id === id ? {
          ...product,
          quantity: product.quantity - 1
        } : product;
      });

      saveProductsOnStorage(updatedCartProducts)

      setProducts(updatedCartProducts);
    },
    [products],
  );

  const saveProductsOnStorage = useCallback(async (products: Product[]) => {
    await AsyncStorage.setItem(
      'GoMarketplace:products',
      JSON.stringify(products),
    );
  }, [])

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
