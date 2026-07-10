import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "@/features/landing/landing-page";

describe("SprintMind landing", () => {
  it("renders the product headline", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Turn every conversation/i)).toBeInTheDocument();
  });
});
