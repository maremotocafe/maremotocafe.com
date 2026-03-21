import type { MenuItem, MenuCategory } from "../data/types";

const BASE = "/_dev/api";

function pickMenuItem(data: MenuItem): MenuItem {
  const {
    nombre,
    disponible,
    imagen,
    imagen_pequenya,
    categorias,
    ingredientes,
    alergenos,
    txt_aclaraciones,
    txt_temporal,
    grad_alcoholica,
    vol_ml,
    edul_gr,
    pvp_local,
    pvp_terraza,
    pvp,
    orden,
  } = data;
  return {
    nombre,
    disponible,
    imagen,
    imagen_pequenya,
    categorias,
    ingredientes,
    alergenos,
    txt_aclaraciones,
    txt_temporal,
    grad_alcoholica,
    vol_ml,
    edul_gr,
    pvp_local,
    pvp_terraza,
    pvp,
    orden,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// --- Items ---

export interface ItemEntry {
  filename: string;
  data: MenuItem;
}

export function getItems(): Promise<ItemEntry[]> {
  return request("items");
}

export function updateItem(
  filename: string,
  data: MenuItem,
): Promise<ItemEntry> {
  return request(`items/${filename}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pickMenuItem(data)),
  });
}

export function createItem(data: MenuItem): Promise<ItemEntry> {
  return request("items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pickMenuItem(data)),
  });
}

export function deleteItem(filename: string): Promise<{ deleted: string }> {
  return request(`items/${filename}`, { method: "DELETE" });
}

// --- Categories ---

export function getCategories(): Promise<MenuCategory[]> {
  return request("categories");
}

export function updateCategories(
  data: MenuCategory[],
): Promise<MenuCategory[]> {
  return request("categories", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// --- Images ---

export function getImages(): Promise<string[]> {
  return request("images");
}

export async function uploadImage(file: File): Promise<{ filename: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/images`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// --- Git ---

export interface GitChange {
  action: string;
  file: string;
  label: string;
}

export interface GitStatus {
  branch: string;
  changes: GitChange[];
}

export function gitStatus(): Promise<GitStatus> {
  return request("git/status", { method: "POST" });
}

export function gitCheckRemote(): Promise<{ behind: number }> {
  return request("git/check-remote", { method: "POST" });
}

export function gitPull(): Promise<{ result: string }> {
  return request("git/pull", { method: "POST" });
}

export function gitPush(): Promise<{ result: string }> {
  return request("git/push", { method: "POST" });
}

export function gitReset(): Promise<{ result: string }> {
  return request("git/reset", { method: "POST" });
}
