'use client'

import { useState, useEffect } from 'react'
import { useUser, useCredits, useSubscription, clearUserCache, getCachedUser, cleanExpiredCache } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { ChevronDown, Zap, LogOut, User as UserIcon, Crown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export default function UserDropdown() {
  const { user, loading } = useUser()
  const credits = useCredits()
  const { isMember } = useSubscription()
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)

  // 初始化时清理过期缓存
  useEffect(() => {
    cleanExpiredCache()
  }, [])

  // 获取缓存用户，优先显示缓存的用户状态
  const cachedUser = getCachedUser()
  const displayUser = user || cachedUser
  
  // 只有在没有任何用户数据且正在加载时才显示loading
  const shouldShowLoading = loading && !displayUser

  // 重置图片错误状态当用户改变时
  useEffect(() => {
    setImageError(false)
    setImageLoading(false)
  }, [displayUser?.id])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        console.error('Google sign in error:', error)
        alert('Login failed, please try again')
      }
    } catch (error) {
      console.error('Google sign in error:', error)
      alert('Login failed, please try again')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        alert('Logout failed, please try again')
      } else {
        // 清除缓存
        clearUserCache()
      }
    } catch (error) {
      console.error('Sign out error:', error)
      alert('Logout failed, please try again')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理图片加载错误
  const handleImageError = () => {
    console.warn('Avatar image failed to load:', displayUser?.user_metadata?.avatar_url)
    setImageError(true)
    setImageLoading(false)
  }

  // 处理图片加载开始
  const handleImageLoadStart = () => {
    setImageLoading(true)
    setImageError(false)
  }

  // 处理图片加载完成
  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  // 只有在真正需要时才显示loading spinner
  if (shouldShowLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (displayUser) {
    // 检查是否有可用的头像URL
    const avatarUrl = displayUser.user_metadata?.avatar_url
    const shouldShowAvatar = avatarUrl && !imageError

    // 调试信息（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('UserDropdown render:', {
        userId: displayUser.id,
        avatarUrl,
        imageError,
        imageLoading
      })
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 p-2">
            {shouldShowAvatar ? (
              <div className="relative w-8 h-8">
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-200 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  </div>
                )}
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={32}
                  height={32}
                  className={`w-8 h-8 rounded-full ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  unoptimized
                  priority={false}
                  onLoadingComplete={handleImageLoad}
                  onLoadStart={handleImageLoadStart}
                  onError={handleImageError}
                />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium leading-none">
                  {displayUser.user_metadata?.full_name || 'User'}
                </p>
                {isMember && (
                  <Crown className="w-4 h-4 text-gray-700" />
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {displayUser.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Credits信息 */}
          <DropdownMenuItem className="flex items-center justify-between p-3 cursor-default">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-gray-700" />
              <span className="text-sm">Available Credits</span>
            </div>
            <span className="text-sm font-bold text-gray-700">
              {credits ? credits.available_credits : (
                <div className="w-4 h-4 border border-gray-700 border-t-transparent rounded-full animate-spin"></div>
              )}
            </span>
          </DropdownMenuItem>
          
          {/* 根据用户状态显示不同的价格链接 */}
          {isMember ? (
            // 会员用户：显示"Purchase Credits"
            <DropdownMenuItem asChild>
              <a href="/pricing" className="text-gray-700 cursor-pointer">
                <Zap className="w-4 h-4 mr-2" />
                <span className="text-sm">Purchase Credits</span>
              </a>
            </DropdownMenuItem>
          ) : (
            // 非会员用户：Credits低于10时显示"Get Subscription"
            credits && credits.available_credits <= 10 && (
              <DropdownMenuItem asChild>
                <a href="/pricing" className="text-gray-700 cursor-pointer">
                  <Zap className="w-4 h-4 mr-2" />
                  <span className="text-sm">Get Subscription</span>
                </a>
              </DropdownMenuItem>
            )
          )}
          
          <DropdownMenuSeparator />
          
          {/* 退出登录 */}
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isLoading}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {isLoading ? 'Signing out...' : 'Sign out'}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
    </Button>
  )
} 