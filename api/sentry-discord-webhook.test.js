import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import { verifySignature, buildDiscordPayload } from './sentry-discord-webhook.js';

describe('verifySignature', () => {
  const secret = 'test-secret';
  const rawBody = JSON.stringify({ hello: 'world' });
  const validSignature = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');

  it('올바른 서명이면 true를 반환한다', () => {
    expect(verifySignature(rawBody, validSignature, secret)).toBe(true);
  });

  it('서명이 틀리면 false를 반환한다', () => {
    expect(verifySignature(rawBody, 'deadbeef', secret)).toBe(false);
  });

  it('바디가 조작되면 false를 반환한다', () => {
    expect(verifySignature(rawBody + 'tampered', validSignature, secret)).toBe(false);
  });

  it('서명 헤더나 시크릿이 없으면 false를 반환한다', () => {
    expect(verifySignature(rawBody, undefined, secret)).toBe(false);
    expect(verifySignature(rawBody, validSignature, undefined)).toBe(false);
  });
});

describe('buildDiscordPayload', () => {
  it('Sentry 이슈 알림 페이로드를 Discord embed로 변환한다', () => {
    const sentryPayload = {
      data: {
        event: {
          title: 'ReferenceError: heck is not defined',
          culprit: '?(<anonymous>)',
          level: 'error',
          web_url: 'https://sentry.io/organizations/hanyangnyang/issues/123/',
        },
        triggered_rule: '프론트 에러 발생 시 알림',
      },
    };

    const result = buildDiscordPayload(sentryPayload);

    expect(result.embeds[0].title).toBe('ReferenceError: heck is not defined');
    expect(result.embeds[0].url).toBe('https://sentry.io/organizations/hanyangnyang/issues/123/');
    expect(result.embeds[0].description).toBe('`?(<anonymous>)`');
    expect(result.embeds[0].color).toBe(0xe03e3e);
    expect(result.embeds[0].fields).toEqual([{ name: '알림 규칙', value: '프론트 에러 발생 시 알림', inline: true }]);
  });

  it('level이 없으면 error 색상을 기본값으로 쓴다', () => {
    const result = buildDiscordPayload({ data: { event: { title: 'x' } } });
    expect(result.embeds[0].color).toBe(0xe03e3e);
  });

  it('필드가 비어있어도 안 깨진다', () => {
    const result = buildDiscordPayload({});
    expect(result.embeds[0].title).toBe('(제목 없음)');
    expect(result.embeds[0].fields).toEqual([]);
  });
});
