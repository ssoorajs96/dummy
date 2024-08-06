import { body, param } from "express-validator";

const userRegisterValidator = () => {
    return [
        body("firstName")
            .trim()
            .notEmpty()
            .withMessage("Firstname is required")
            .isLowercase()
            .withMessage("Firstname must be lowercase")
            .isLength({ min: 3 })
            .withMessage("Firstname must be at lease 3 characters long"),
        body("lastName")
            .trim()
            .notEmpty()
            .withMessage("Lastname is required")
            .isLowercase()
            .withMessage("Lastname must be lowercase")
            .isLength({ min: 1 })
            .withMessage("Lastname must be at lease 1 characters long"),
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("password").trim().notEmpty().withMessage("Password is required"),
    ];
};

const loginValidator = () => {
    return [
        body("email").optional().isEmail().withMessage("Email is invalid"),
        body("userName").optional(),
        body("password").notEmpty().withMessage("Password is required"),
    ];
};

export { userRegisterValidator, loginValidator };
