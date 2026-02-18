abstract class Store {
  static STATUS = {
    INITIAL: 'INITIAL',
    TIMEOUT: 'TIMEOUT',
    OTHER: 'OTHER',
    COMPLETED: 'COMPLETED',
  };

  abstract getById(id: string): Promise<any>;

  abstract append(id: string, headers: any, body: any): Promise<any>;

  abstract setStatus(id: string, status: string): Promise<any>;
}

export default Store;
