export class Util {
  static sleep(ms: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }
}
