import { Request, Response } from "express";
import * as userService from "./user.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";


export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const user = await userService.register(email, password, role);
  res.status(201).json(user);
});


export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await userService.login(email, password);

  res.cookie("token", result.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 1000,
  });

  res.status(201).json(result);
});