declare module "*.mp3" {
  const value: any;

  export default value;
}

declare module "*.pegjs" {
  export const plainText: string;
}

declare module "*?url" {
  export const value: string;

  export default value;
}
