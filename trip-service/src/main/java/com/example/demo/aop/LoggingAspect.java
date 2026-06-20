package com.example.demo.aop;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class LoggingAspect {

    // 🔹 All controller methods
    @Before("execution(* com.example.demo.controller.*.*(..))")
    public void beforeController(JoinPoint jp) {
        System.out.println("➡️ API Called: " + jp.getSignature());
    }

    // 🔹 All service methods
    @Before("execution(* com.example.demo.service.*.*(..))")
    public void beforeService(JoinPoint jp) {
        System.out.println("🔧 Service Start: " + jp.getSignature());
    }

    @AfterReturning(pointcut = "execution(* com.example.demo.service.*.*(..))", returning = "result")
    public void afterReturn(JoinPoint jp, Object result) {
        System.out.println("✅ Service End: " + jp.getSignature() + " -> " + result);
    }
}