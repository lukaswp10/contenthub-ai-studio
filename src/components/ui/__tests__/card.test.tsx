import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Card, CardContent } from "../card"

describe("Card Components", () => {
  it("renders Card correctly", () => {
    render(
      <Card data-testid="card">
        <CardContent>Card content</CardContent>
      </Card>
    )
    
    expect(screen.getByTestId("card")).toBeInTheDocument()
    expect(screen.getByText("Card content")).toBeInTheDocument()
  })
})
