// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'stream/web';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = jest.fn();

// Mock Next.js Request/Response
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map(Object.entries(init?.headers || {}));
    this.body = init?.body;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }
  
  async json() {
    return JSON.parse(this.body);
  }
};