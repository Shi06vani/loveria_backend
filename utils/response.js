export const errorResponse = (
  res,
  message = "Something went wrong",
  statusCode = 500
) => {
  return res.status(statusCode).json({
    status: false,
    message,
    data: {},
  });
};

export const successResponse = (
  res,
  message = "Success",
  data = {},
  statusCode = 200
) => {
  return res.status(statusCode).json({
    status: true,
    message,
    data,
  });
};

const sendResponse = (res, success, statusCode, data, message) => {
  return res.status(statusCode).json({
    status: success,
    message: message || (success ? "Success" : "Error"),
    data: data || {},
  });
};

export default sendResponse;
