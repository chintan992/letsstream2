import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SimklCallback from "./SimklCallback";

vi.mock("react-router-dom", async importOriginal => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return actual;
});

const mocks = vi.hoisted(() => ({
  exchangeCodeForToken: vi.fn(),
  updatePreferences: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/simkl", () => ({
  SimklService: {
    exchangeCodeForToken: mocks.exchangeCodeForToken,
  },
}));

vi.mock("@/contexts/user-preferences", () => ({
  useUserPreferences: () => ({
    updatePreferences: mocks.updatePreferences,
  }),
}));

vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

describe("SimklCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForToken.mockResolvedValue({
      access_token: "simkl-access-token",
    });
    mocks.updatePreferences.mockResolvedValue(undefined);
  });

  it("completes the connection in React Strict Mode", async () => {
    render(
      <StrictMode>
        <MemoryRouter
          initialEntries={["/simkl-callback?code=auth-code&state=oauth-state"]}
        >
          <Routes>
            <Route path="/simkl-callback" element={<SimklCallback />} />
            <Route path="/profile" element={<p>Profile</p>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() =>
      expect(screen.getByText("Profile")).toBeInTheDocument()
    );

    expect(mocks.exchangeCodeForToken).toHaveBeenCalledTimes(1);
    expect(mocks.updatePreferences).toHaveBeenCalledWith({
      simklToken: "simkl-access-token",
      isSimklEnabled: true,
    });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Simkl Connected" })
    );
  });
});
