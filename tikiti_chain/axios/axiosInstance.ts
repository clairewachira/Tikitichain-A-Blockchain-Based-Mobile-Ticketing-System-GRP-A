import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosResponse, AxiosError } from "axios";

const apiV2Url = "";

export const axiosInstance = axios.create({
  baseURL: apiV2Url,
  timeout: 10000,
  timeoutErrorMessage: "Request timeout",
  headers: {
    "Content-Type": "application/json",
  },
});

// response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`intercepted response>> Url:${response.config.url}`, response);
    return response;
  },
  (error: AxiosError) => {
    console.log(
      `Api endpoint error>> Url:${error.config?.url}`,
      error.response,
    );
    throw error.response;
  },
);

axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("token is ", token);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.log("Error reading user", err);
    }
    console.log("sending request>>", config.url);
    return config;
  },
  (err) => {
    console.log("error:", err);
    return Promise.reject(err);
  },
);
