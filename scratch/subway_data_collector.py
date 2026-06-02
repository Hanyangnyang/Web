import urllib.request
import json
import time
import datetime
import os

KEY = '4557506f416b646a33337a7566784c'
STATION = '%ED%95%9C%EB%8C%80%EC%95%9E' # 한대앞
URL = f'http://swopenapi.seoul.go.kr/api/subway/{KEY}/json/realtimeStationArrival/0/15/{STATION}'

print("지하철 실시간 소요시간 데이터 수집기를 시작합니다... (종료: Ctrl+C)")
print("API를 15초 주기로 호출하여 열차의 이동 시간을 실측합니다.")
print("4호선과 수인분당선의 평균값을 분리하여 기록합니다.\n")

# 열차 상태 추적 딕셔너리
train_tracker = {}
completed_records = []

def fetch_data():
    try:
        req = urllib.request.Request(URL)
        with urllib.request.urlopen(req, timeout=5) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"API 호출 에러: {e}")
        return None

try:
    while True:
        data = fetch_data()
        now = time.time()
        
        if data and 'realtimeArrivalList' in data:
            current_trains = set()
            
            for train in data['realtimeArrivalList']:
                train_id = f"{train.get('updnLine')}-{train.get('btrainNo')}"
                current_msg = train.get('arvlMsg2')
                subway_id = train.get('subwayId')
                line_name = "4호선" if subway_id == "1004" else "수인분당선"
                
                current_trains.add(train_id)
                
                if train_id not in train_tracker:
                    train_tracker[train_id] = {
                        'dest': train.get('bstatnNm'),
                        'line_name': line_name,
                        'last_msg': current_msg,
                        'last_time': now,
                        'transitions': []
                    }
                else:
                    tracker = train_tracker[train_id]
                    if tracker['last_msg'] != current_msg:
                        elapsed = now - tracker['last_time']
                        transition_str = f"{tracker['last_msg']} -> {current_msg}"
                        
                        tracker['transitions'].append({
                            'from': tracker['last_msg'],
                            'to': current_msg,
                            'seconds': round(elapsed)
                        })
                        
                        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [{line_name}] {train_id}({tracker['dest']}행): {transition_str} ({round(elapsed)}초 소요)")
                        
                        tracker['last_msg'] = current_msg
                        tracker['last_time'] = now
                        
        time.sleep(15)

except KeyboardInterrupt:
    print("\n\n데이터 수집을 종료합니다. 결과를 파일로 저장합니다...")
    
    # 결과 요약 계산
    summary = {}
    for train_id, tracker in train_tracker.items():
        line_name = tracker['line_name']
        for t in tracker['transitions']:
            # 노선 이름을 키에 포함시켜 4호선과 수인분당선을 완벽 분리
            key = f"[{line_name}] {t['from']} ➡️ {t['to']}"
            if key not in summary:
                summary[key] = []
            summary[key].append(t['seconds'])
    
    # 파일 저장
    filename = f"subway_timelog_{datetime.datetime.now().strftime('%Y%md_%H%M')}.txt"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write("=== 지하철 노선 및 구간별 실측 소요시간 요약 ===\n\n")
        for key, times in summary.items():
            avg = sum(times) / len(times)
            f.write(f"구간: {key}\n")
            f.write(f" - 평균 소요시간: {round(avg)}초 (측정 횟수: {len(times)}회)\n")
            f.write(f" - 원본 데이터: {times}\n\n")
            
    print(f"결과가 {filename} 파일에 성공적으로 저장되었습니다!")
