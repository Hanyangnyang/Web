const handlers = [];

export const pushBackHandler = (fn) => handlers.push(fn);
export const popBackHandler = () => handlers.pop();
export const invokeBackHandler = () => {
  if (handlers.length > 0) {
    handlers[handlers.length - 1]();
    return true;
  }
  return false;
};
