import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'zanoShortString'
})
export class ShortStringPipe implements PipeTransform {
  transform(value: string | null | undefined, left: number = 6, right: number = 6): string | null | undefined {
    return value && `${ value.slice(0, left) }...${ value.slice(-right) }`;
  }
}
