var ErrorCodes = {
    TokenExpired: { code: -1, Message: "Token has been expired." },
    TokenIsInvalid: { code: -2, Message: "Token is invalid." },
    UserDoesNotExist: { code: -3, Message: "User doesn't exist." },
    PasswordIsInvalid: { code: -4, Message: "Password is invalid." },
    TokenIsUndefined: { code: -5, Message: "Token is undifined." },
    UnAuthorized:{code: -6, Message:"Not authorized."},
    MissingUserId: {code : -7, Message: "MissingUserId"},
    SMSCenterNameNotFound: {code: -8, Message: "provided sms center name not found"},
    ErrorInQueryInDatabase: {code: -9, Message: "Error occurred in query in database"}
};

module.exports.ErrorCodes = ErrorCodes;