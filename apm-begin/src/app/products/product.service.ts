import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorService } from '../utilities/http-error.service';
import { ReviewService } from '../reviews/review.service';
import { Product, Result } from './product';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { Review } from '../reviews/review';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  // Just enough here for the code to compile
  private productsUrl = 'api/products';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  private reviewService = inject(ReviewService);

  selectedProductId = signal<number | undefined>(undefined);

  isLoading = signal(false);

  // private productSelectedSubject = new BehaviorSubject<number | undefined>(
  //   undefined
  // );
  // readonly productSelected$ = this.productSelectedSubject.asObservable();

  // private products$ = this.http.get<Product[]>(this.productsUrl).pipe(
  //   tap((p) => console.log(JSON.stringify(p))),
  //   shareReplay(1),
  //   catchError((err) => this.handleError(err))
  // );
  // products = toSignal(this.products$, { initialValue: [] as Product[] });
  private productsResult$ = this.http.get<Product[]>(this.productsUrl)
    .pipe(
      map(p => ({ data: p } as Result<Product[]>)),
      tap(p => console.log(JSON.stringify(p))),
      shareReplay(1),
      catchError(err => of({
        data: [],
        error: this.errorService.formatError(err)
      } as Result<Product[]>))
    );

  private productsResult = toSignal(this.productsResult$,{ initialValue: ({ data: [] } as Result<Product[]>) });
  products = computed(() => this.productsResult().data);
  productsError = computed(() => this.productsResult().error);

  // readonly product$ = this.productSelected$.pipe(
  //   filter(Boolean),
  //   switchMap((id) => {
  //     const productUrl = this.productsUrl + '/' + id;
  //     return this.http.get<Product>(productUrl).pipe(
  //       switchMap((product) => this.getProductWithReviews(product)),
  //       catchError((err) => this.handleError(err))
  //     );
  //   })
  // );

  // Find the product in the existing array of products
  private foundProduct = computed(() => {
    // Dependent signals
    const p = this.products();
    const id = this.selectedProductId();
    if (p && id) {
      return p.find(product => product.id === id);
    }
    return undefined;
  })
  // Get the related set of reviews
  private productResult$ = toObservable(this.foundProduct)
    .pipe(
      filter(Boolean),
      switchMap(product => this.getProductWithReviews(product)),
      map(p => ({ data: p } as Result<Product>)),
      catchError(err => of({
        data: undefined,
        error: this.errorService.formatError(err)
      } as Result<Product>)),
      tap(() => this.isLoading.set(false)),
    );
  
  private productResult = toSignal(this.productResult$);
  product = computed(() => this.productResult()?.data);
  productError = computed(() => this.productResult()?.error);

  // product$ = combineLatest([this.productSelected$, this.products$]).pipe(
  //   tap((x) => console.log(x)),
  //   map(([selectedProductId, products]) =>
  //     products.find((product) => product.id === selectedProductId)
  //   ),
  //   filter(Boolean),
  //   switchMap((product) => this.getProductWithReviews(product)),
  //   catchError((err) => this.handleError(err))
  // );

  private getProductWithReviews(product: Product): Observable<Product> {
    if (product.hasReviews) {
      return this.http
        .get<Review[]>(this.reviewService.getReviewUrl(product.id))
        .pipe(map((reviews) => ({ ...product, reviews } as Product)));
    } else {
      return of(product);
    }
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const formattedMessage = this.errorService.formatError(err);
    return throwError(() => formattedMessage);
    // throw formattedMessage;
  }

  productSelected(selectedProductId: number): void {
    // this.productSelectedSubject.next(selectedProductId);
    this.selectedProductId.set(selectedProductId);
    
    this.isLoading.set(true)
  }
}
