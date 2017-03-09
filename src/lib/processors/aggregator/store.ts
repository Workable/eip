abstract class Store {
  static STATUS = {
    INITIAL: 'INITIAL',
    TIMEOUT: 'TIMEOUT',
    OTHER: 'OTHER',
    COMPLETED: 'COMPLETED',
  };

  abstract async getById(id: string): Promise<any>;

  abstract async append(id: string, headers: any, body: any): Promise<any>;

  abstract async setStatus(id: string, status: string): Promise<any>;
}

export default Store;
