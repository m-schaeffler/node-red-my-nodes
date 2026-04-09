const Semaphore = require( "./semaphore.js" );

class Mutex {
  // Setting up our single-key system
  constructor() {
    // We create a Semaphore with maxConcurrent = 1
    // This means only one "key" is available
    this.semaphore = new Semaphore(1);
  }

  // When someone wants to use the resource
  async lock() {
    // Try to get the key
    return this.semaphore.acquire();
  }

  // When someone is done with the resource
  unlock() {
    // Return the key
    this.semaphore.release();
  }

  // A safer way to use the lock - it's like a self-closing door!
  async withLock(fn) {
    await this.lock();      // Get the key
    try {
      return await fn();    // Do what you need to do
    } finally {
      this.unlock();        // ALWAYS return the key, even if there's an error
    }
  }
}

module.exports = Mutex;
