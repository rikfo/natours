module.exports = (fn) => {
  return (req, res, next) => {
    //when an error occurrs this function will send the error to the errorHandler that's why we use next;
    fn(req, res, next).catch(next);
  };
};
