package com.example.demo.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String OTP_QUEUE = "otpQueue";
    public static final String OTP_EXCHANGE = "otpExchange";
    public static final String OTP_ROUTING_KEY = "otpRoutingKey";

    @Bean
    public Queue otpQueue() {
        return new Queue(OTP_QUEUE, true); // true for durable
    }

    @Bean
    public DirectExchange otpExchange() {
        return new DirectExchange(OTP_EXCHANGE);
    }

    @Bean
    public Binding binding(Queue otpQueue, DirectExchange otpExchange) {
        return BindingBuilder.bind(otpQueue).to(otpExchange).with(OTP_ROUTING_KEY);
    }
}
