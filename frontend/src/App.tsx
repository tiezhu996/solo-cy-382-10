import { Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, Layout, List, Modal, Row, Select, Space, Statistic, Tabs, message } from 'antd';
import { EnvironmentOutlined, MessageOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { api } from './api';

const trips = [
  { destination: '大理', departDate: '2026-07-12', days: 5, budget: '3500-5200', transport: '公共交通', score: 96 },
  { destination: '青海湖', departDate: '2026-08-03', days: 7, budget: '4800-6800', transport: '自驾', score: 88 }
];

interface CurrentUser {
  id: number;
  nickname: string;
}

interface TripItem {
  id: number;
  destination: string;
  departDate: string;
  days: number;
  budgetMin?: number;
  budgetMax?: number;
  transport: string;
  companionCount: number;
  genderPreference?: string;
  status: string;
  favorited: boolean;
}

interface FavoriteEntry {
  tripId: number;
  favorited: boolean;
  favoritedAt: string;
  trip: TripItem;
}

function readStoredUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [messages, setMessages] = useState(['系统：已进入大理行程协作空间']);
  const [user, setUser] = useState<CurrentUser | null>(readStoredUser);
  const [authOpen, setAuthOpen] = useState(false);
  const [tripList, setTripList] = useState<TripItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const socket = useMemo(() => io('/', { path: '/socket.io' }), []);
  const send = () => {
    socket.emit('trip-message', { tripId: 1, sender: '我', content: '今晚确认民宿地址', type: 'text' });
    setMessages(items => [...items, '我：今晚确认民宿地址']);
  };

  const showError = (error: unknown) => message.error(error instanceof Error ? error.message : '操作失败');

  const loadTrips = useCallback(async () => {
    try {
      setTripList(await api<TripItem[]>('/trips'));
    } catch (error) {
      showError(error);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setFavorites([]);
      return;
    }
    try {
      setFavorites(await api<FavoriteEntry[]>('/favorites'));
    } catch (error) {
      showError(error);
    }
  }, []);

  useEffect(() => { void loadTrips(); }, [loadTrips, user]);
  useEffect(() => { void loadFavorites(); }, [loadFavorites, user]);

  const login = async (values: { email: string; password: string }) => {
    try {
      const result = await api<{ token: string; user: CurrentUser }>('/users/login', { method: 'POST', body: JSON.stringify(values) });
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);
      setAuthOpen(false);
      message.success(`欢迎回来，${result.user.nickname}`);
    } catch (error) {
      showError(error);
    }
  };

  const register = async (values: { email: string; nickname: string; password: string }) => {
    try {
      await api('/users/register', { method: 'POST', body: JSON.stringify(values) });
      await login({ email: values.email, password: values.password });
    } catch (error) {
      showError(error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const toggleFavorite = async (trip: TripItem) => {
    if (!user) {
      message.warning('请先登录后再收藏行程');
      setAuthOpen(true);
      return;
    }
    try {
      await api(`/trips/${trip.id}/favorite`, { method: trip.favorited ? 'DELETE' : 'POST' });
      await Promise.all([loadTrips(), loadFavorites()]);
    } catch (error) {
      showError(error);
    }
  };

  const favoriteButton = (trip: TripItem) => (
    <Button type="text" icon={trip.favorited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} onClick={() => void toggleFavorite(trip)}>
      {trip.favorited ? '已收藏' : '收藏'}
    </Button>
  );

  return (
    <Layout className="shell">
      <Layout.Sider width={240} className="side">
        <h1>旅伴匹配</h1>
        <p>TripMatch</p>
        {user ? (
          <Space direction="vertical">
            <span>你好，{user.nickname}</span>
            <Button size="small" ghost onClick={logout}>退出登录</Button>
          </Space>
        ) : (
          <Button type="primary" ghost onClick={() => setAuthOpen(true)}>登录 / 注册</Button>
        )}
      </Layout.Sider>
      <Layout.Content className="content">
        <Tabs items={[
          { key: 'publish', label: '发布行程', children: <Card><Form layout="vertical" className="form"><Form.Item label="目的地"><Input defaultValue="大理" /></Form.Item><Form.Item label="出发时间"><DatePicker /></Form.Item><Form.Item label="预算上限"><InputNumber defaultValue={5200} /></Form.Item><Form.Item label="出行方式"><Select defaultValue="公共交通" options={['自驾','公共交通','徒步'].map(v => ({ value: v }))} /></Form.Item><Button type="primary">发布计划</Button></Form></Card> },
          { key: 'match', label: '智能匹配', children: <Row gutter={16}>{trips.map(trip => <Col span={12} key={trip.destination}><Card title={<><EnvironmentOutlined /> {trip.destination}</>}><p>{trip.departDate} / {trip.days} 天 / {trip.transport}</p><Statistic title="匹配度" value={trip.score} suffix="%" /><Button>申请加入</Button></Card></Col>)}</Row> },
          { key: 'browse', label: '行程列表', children: tripList.length === 0 ? <Empty description="还没有已发布的行程" /> : <Row gutter={[16, 16]}>{tripList.map(trip => <Col span={12} key={trip.id}><Card title={<><EnvironmentOutlined /> {trip.destination}</>} extra={favoriteButton(trip)}><p>{trip.departDate} / {trip.days} 天 / {trip.transport}</p><p>预算 {trip.budgetMin ?? '-'} ~ {trip.budgetMax ?? '-'}</p></Card></Col>)}</Row> },
          { key: 'favorites', label: '我的收藏', children: user ? <List dataSource={favorites} locale={{ emptyText: '还没有收藏行程' }} renderItem={entry => <List.Item actions={[favoriteButton(entry.trip)]}><List.Item.Meta title={<><EnvironmentOutlined /> {entry.trip.destination}</>} description={`${entry.trip.departDate} 出发 / ${entry.trip.days} 天 / 收藏于 ${new Date(entry.favoritedAt).toLocaleString()}`} /></List.Item>} /> : <Card>登录后即可查看收藏的行程</Card> },
          { key: 'board', label: '协作看板', children: <Card title="每日安排"><List dataSource={['Day 1 抵达与集合','Day 2 环洱海','Day 3 沙溪古镇']} renderItem={item => <List.Item>{item}</List.Item>} /></Card> },
          { key: 'chat', label: '即时沟通', children: <Card title={<><MessageOutlined /> 行程群聊</>}><List dataSource={messages} renderItem={item => <List.Item>{item}</List.Item>} /><Button onClick={send}>发送示例消息</Button></Card> }
        ]} />
      </Layout.Content>
      <Modal open={authOpen} footer={null} title="登录 TripMatch" onCancel={() => setAuthOpen(false)} destroyOnClose>
        <Tabs items={[
          { key: 'login', label: '登录', children: <Form layout="vertical" onFinish={login}><Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}><Input /></Form.Item><Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password /></Form.Item><Button type="primary" htmlType="submit" block>登录</Button></Form> },
          { key: 'register', label: '注册', children: <Form layout="vertical" onFinish={register}><Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}><Input /></Form.Item><Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}><Input /></Form.Item><Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password /></Form.Item><Button type="primary" htmlType="submit" block>注册并登录</Button></Form> }
        ]} />
      </Modal>
    </Layout>
  );
}
