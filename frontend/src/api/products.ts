import { api } from "./client";
import type { Product } from "../types/models";

export async function fetchProducts() {
  const { data } = await api.get<Product[]>("/products");
  return data;
}
