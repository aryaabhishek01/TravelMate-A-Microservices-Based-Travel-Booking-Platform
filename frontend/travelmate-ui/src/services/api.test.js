import API from "./api";
import axios from "axios";

jest.mock("axios", () => {
  const mAxiosInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };
  return {
    create: jest.fn(() => mAxiosInstance)
  };
});

describe("API Service Interceptors", () => {
  let requestInterceptor;
  let responseInterceptor;
  let responseErrorInterceptor;

  beforeAll(() => {
    // Extract registered interceptors (api.js runs once)
    requestInterceptor = API.interceptors.request.use.mock.calls[0][0];
    responseInterceptor = API.interceptors.response.use.mock.calls[0][0];
    responseErrorInterceptor = API.interceptors.response.use.mock.calls[0][1];
  });

  beforeEach(() => {
    // Clear storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Mock window.location
    delete window.location;
    window.location = { href: "" };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should attach token from sessionStorage to headers", () => {
    sessionStorage.setItem("token", "session-token");
    const req = { headers: {} };
    const newReq = requestInterceptor(req);
    expect(newReq.headers.Authorization).toBe("Bearer session-token");
  });

  test("should attach token from localStorage if sessionStorage is empty", () => {
    localStorage.setItem("token", "local-token");
    const req = { headers: {} };
    const newReq = requestInterceptor(req);
    expect(newReq.headers.Authorization).toBe("Bearer local-token");
  });

  test("should not attach token if storage is empty", () => {
    const req = { headers: {} };
    const newReq = requestInterceptor(req);
    expect(newReq.headers.Authorization).toBeUndefined();
  });

  test("should pass through successful response", () => {
    const res = { data: "ok" };
    expect(responseInterceptor(res)).toBe(res);
  });

  test("should clear storage and redirect on 401 error", async () => {
    sessionStorage.setItem("token", "bad-token");
    localStorage.setItem("token", "bad-token");
    
    const err = { response: { status: 401 } };
    
    await expect(responseErrorInterceptor(err)).rejects.toEqual(err);
    
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(window.location.href).toBe("/");
  });

  test("should reject other errors without redirecting", async () => {
    sessionStorage.setItem("token", "valid-token");
    const err = { response: { status: 500 } };
    
    await expect(responseErrorInterceptor(err)).rejects.toEqual(err);
    
    expect(sessionStorage.getItem("token")).toBe("valid-token");
    expect(window.location.href).toBe("");
  });
});
