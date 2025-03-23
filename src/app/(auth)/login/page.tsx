import React from "react";
import PageClient from "./page-client";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Alochona | Login",
  description: "Login to continue",
};
const page = async () => {
  return <PageClient />;
};
export default page;
