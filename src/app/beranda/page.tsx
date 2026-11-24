import { redirect } from "next/navigation";

/** Alamat halaman awal di 1.0.0. Sejak 1.0.1 halaman awal = "/"; alamat lama ini diteruskan. */
export default function Beranda() {
  redirect("/");
}
