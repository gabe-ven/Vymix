#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "RNLinearGradientUtils.h"
#import "RNLinearTextGradientShadowView.h"
#import "RNLinearTextGradientShadowViewDelegate.h"
#import "RNLinearTextGradientViewManager.h"
#import "RNTextGradientShadowView.h"
#import "RNTextGradientShadowViewDelegate.h"
#import "RNTextGradientUtils.h"
#import "RNTextGradientValue.h"
#import "RNTextGradientView.h"
#import "RNTextGradientViewManager.h"
#import "RNVirtualLinearTextGradientShadowView.h"
#import "RNVirtualLinearTextGradientViewManager.h"
#import "RNVirtualTextGradientShadowView.h"
#import "RNVirtualTextGradientViewManager.h"

FOUNDATION_EXPORT double RNTextGradientViewVersionNumber;
FOUNDATION_EXPORT const unsigned char RNTextGradientViewVersionString[];

