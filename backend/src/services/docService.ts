const docs: Record<string, string> = {
  'printf': 'printf(const char *format, ...)\nPrints formatted output to the standard output stream.',
  'scanf': 'scanf(const char *format, ...)\nReads formatted input from the standard input stream.',
  'malloc': 'void *malloc(size_t size)\nAllocates a block of size bytes of memory, returning a pointer to the beginning of the block.',
  'free': 'void free(void *ptr)\nDeallocates the memory previously allocated by a call to calloc, malloc, or realloc.',
  'strlen': 'size_t strlen(const char *str)\nComputes the length of the string str up to, but not including the terminating null character.',
};

export const getDocumentation = (funcName: string) => {
  return docs[funcName] || null;
};
