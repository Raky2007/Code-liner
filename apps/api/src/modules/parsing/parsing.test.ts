import { JavaScriptAnalyzer } from './js-analyzer';
import { PythonAnalyzer } from './generic-analyzers';

describe('Language Analyzers', () => {
  describe('JavaScript/TypeScript Analyzer', () => {
    const analyzer = new JavaScriptAnalyzer();

    it('should parse imports and exports correctly', async () => {
      const code = `
        import React from 'react';
        import { useState } from 'react';
        const config = require('./config');
        
        export const myVar = 10;
        export default function calculateSum(a, b) {
          return a + b;
        }
      `;
      const result = await analyzer.parse(code, 'test.js');
      expect(result.language).toBe('javascript');
      expect(result.imports).toContainEqual({ name: 'React', path: 'react', isExternal: true });
      expect(result.imports).toContainEqual({ name: 'useState', path: 'react', isExternal: true });
      expect(result.exports).toContainEqual({ name: 'myVar', type: 'variable' });
      expect(result.exports).toContainEqual({ name: 'calculateSum', type: 'function' });
    });

    it('should extract classes, methods, and calculate complexity', async () => {
      const code = `
        class UserController {
          constructor() {
            this.users = [];
          }
          
          async getUser(id) {
            if (!id) {
              return null;
            }
            for (let i = 0; i < this.users.length; i++) {
              if (this.users[i].id === id) {
                return this.users[i];
              }
            }
            return null;
          }
        }
      `;
      const result = await analyzer.parse(code, 'test.js');
      expect(result.classes.length).toBe(1);
      expect(result.classes[0].name).toBe('UserController');
      expect(result.classes[0].methods).toContain('getUser');
      
      const getUserFunc = result.functions.find(f => f.name === 'getUser');
      expect(getUserFunc).toBeDefined();
      expect(getUserFunc?.complexity).toBe(4);
    });
  });

  describe('Python Analyzer', () => {
    const analyzer = new PythonAnalyzer();

    it('should parse imports and functions', async () => {
      const code = `
import os
from django.http import HttpResponse

class SimpleView:
    def get(self, request):
        if request.user.is_authenticated:
            return HttpResponse("Hello " + request.user.username)
        else:
            return HttpResponse("Hello guest")
      `;
      const result = await analyzer.parse(code, 'view.py');
      expect(result.language).toBe('python');
      expect(result.imports).toContainEqual({ name: 'os', path: 'os', isExternal: true });
      expect(result.imports).toContainEqual({ name: 'HttpResponse', path: 'django.http', isExternal: true });
      expect(result.classes.length).toBe(1);
      expect(result.classes[0].name).toBe('SimpleView');
      expect(result.classes[0].methods).toContain('get');

      const getFunc = result.functions.find(f => f.name === 'get');
      expect(getFunc).toBeDefined();
      expect(getFunc?.complexity).toBe(2);
    });
  });
});
