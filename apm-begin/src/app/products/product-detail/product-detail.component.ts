import { Component, computed, effect, inject, Input, signal } from '@angular/core';

import { NgIf, NgFor, CurrencyPipe, AsyncPipe } from '@angular/common';
import { Product } from '../product';
import { catchError, EMPTY, single, Subscription } from 'rxjs';
import { ProductService } from '../product.service';
import { CartService } from 'src/app/cart/cart.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, CurrencyPipe],
})
export class ProductDetailComponent {
  // Just enough here for the template to compile
  // @Input() productId: number = 0;
  // sub!: Subscription;

  private productService = inject(ProductService);
  private cartService = inject(CartService);

  

  // Product to display
  // product$ = this.productService.product$.pipe(
  //   catchError((err) => {
  //     this.errorMessage = err;
  //     return EMPTY;
  //   })
  // );

  product = this.productService.product;
  productSelectId = this.productService.selectedProductId;
  errorMessage = this.productService.productError;

  // Set the page title
  // pageTitle = 'Product Detail';
  pageTitle = computed(() =>
    this.product()
      ? `Product Detail for: ${this.product()?.productName}`
      : 'Product Detail')

  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }
}
