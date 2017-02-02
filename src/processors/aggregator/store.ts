abstract class Store {
  static STATUS = {
    INITIAL: 'INITIAL',
    TIMEOUT: 'TIMEOUT',
    OTHER: 'OTHER',
    COMPLETED: 'COMPLETED',
  };

  abstract getById(id: string);

  abstract append(id: string, headers: any, body: any);

  abstract setStatus(id: string, status: string);
}

export default Store;
