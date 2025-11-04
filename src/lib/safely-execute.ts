import { logError } from './logging';

export function safelyExecute<T>(
   operation: () => T,
   errorMessage: string,
   fallbackValue?: T
): T | undefined {
   try {
      return operation();
   } catch(error) {
      logError(errorMessage, error);
      return fallbackValue;
   }
}

export async function safelyExecuteAsync<T>(
   operation: () => Promise<T>,
   errorMessage: string,
   fallbackValue?: T
): Promise<T | undefined> {
   try {
      return await operation();
   } catch(error) {
      logError(errorMessage, error);
      return fallbackValue;
   }
}
