import userReducer, { setUser, setCredentials, logout } from "./userSlice";

describe("userSlice reducer", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  const initialState = {
    user: null,
    token: null,
    role: null,
    email: null,
  };

  test("should handle initial state", () => {
    expect(userReducer(undefined, { type: "unknown" })).toEqual(initialState);
  });

  test("should handle setUser", () => {
    const actual = userReducer(initialState, setUser({ name: "John" }));
    expect(actual.user).toEqual({ name: "John" });
  });

  test("should handle setCredentials", () => {
    const credentials = {
      token: "test-token",
      role: "USER",
      email: "test@test.com"
    };
    const actual = userReducer(initialState, setCredentials(credentials));
    expect(actual.token).toEqual("test-token");
    expect(actual.role).toEqual("USER");
    expect(actual.email).toEqual("test@test.com");
  });

  test("should handle logout", () => {
    const loggedInState = {
      user: { name: "John" },
      token: "test-token",
      role: "USER",
      email: "test@test.com"
    };
    const actual = userReducer(loggedInState, logout());
    expect(actual).toEqual(initialState);
  });
});
